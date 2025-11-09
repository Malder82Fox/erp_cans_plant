"""Management CLI for user operations."""
from __future__ import annotations

import argparse

from erp.backend.core.database import session_scope
from erp.backend.models.user import User, UserRole
from erp.backend.repositories.user import UserRepository
from erp.backend.schemas.users import UserCreateRequest, UserResetPasswordRequest, UserUpdateRequest
from erp.backend.services.users import UserService


def get_actor(repo: UserRepository, username: str) -> User:
    actor = repo.get_by_username(username)
    if not actor:
        msg = f"Actor '{username}' not found"
        raise SystemExit(msg)
    if actor.role != UserRole.ROOT:
        raise SystemExit("Actor must have root role")
    return actor


def handle_create(args: argparse.Namespace) -> None:
    with session_scope() as session:
        repo = UserRepository(session)
        actor = get_actor(repo, args.actor)
        service = UserService(session)
        payload = UserCreateRequest(
            username=args.username,
            email=args.email,
            role=UserRole(args.role),
            password=args.password,
            must_change_password=args.must_change,
        )
        user = service.create_user(actor=actor, payload=payload)
        session.commit()
        print(f"Created user {user.username} with role {user.role.value}")


def handle_set_role(args: argparse.Namespace) -> None:
    with session_scope() as session:
        repo = UserRepository(session)
        actor = get_actor(repo, args.actor)
        service = UserService(session)
        target = repo.get_by_username(args.username)
        if not target:
            raise SystemExit(f"User '{args.username}' not found")
        payload = UserUpdateRequest(role=UserRole(args.role))
        user = service.update_user(actor=actor, user_id=target.id, payload=payload)
        session.commit()
        print(f"Updated user {user.username} role to {user.role.value}")


def handle_toggle_active(args: argparse.Namespace, active: bool) -> None:
    with session_scope() as session:
        repo = UserRepository(session)
        actor = get_actor(repo, args.actor)
        service = UserService(session)
        target = repo.get_by_username(args.username)
        if not target:
            raise SystemExit(f"User '{args.username}' not found")
        payload = UserUpdateRequest(is_active=active)
        user = service.update_user(actor=actor, user_id=target.id, payload=payload)
        session.commit()
        state = "activated" if active else "deactivated"
        print(f"{state.capitalize()} user {user.username}")


def handle_reset_password(args: argparse.Namespace) -> None:
    with session_scope() as session:
        repo = UserRepository(session)
        actor = get_actor(repo, args.actor)
        service = UserService(session)
        target = repo.get_by_username(args.username)
        if not target:
            raise SystemExit(f"User '{args.username}' not found")
        payload = UserResetPasswordRequest(
            temporary_password=args.password,
            must_change_password=args.must_change,
        )
        user = service.reset_password(actor=actor, user_id=target.id, payload=payload)
        session.commit()
        print(f"Reset password for user {user.username}")


def handle_list(args: argparse.Namespace) -> None:
    with session_scope() as session:
        repo = UserRepository(session)
        actor = get_actor(repo, args.actor)
        service = UserService(session)
        role = UserRole(args.role) if args.role else None
        users, total = service.list_users(
            actor=actor,
            role=role,
            is_active=args.active,
            q=args.query,
            page=1,
            page_size=1000,
        )
        print(f"Total users: {total}")
        for user in users:
            print(
                f"- {user.id}: {user.username} ({user.role.value}) | active={user.is_active} | must_change={user.must_change_password}"
            )


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="ERP management CLI")
    entity_parsers = parser.add_subparsers(dest="entity", required=True)

    users_parser = entity_parsers.add_parser("users", help="User management commands")
    users_parser.add_argument("--actor", default="root", help="Username performing the action (must be root)")
    user_subparsers = users_parser.add_subparsers(dest="command", required=True)

    create_parser = user_subparsers.add_parser("create", help="Create a user")
    create_parser.add_argument("--username", required=True)
    create_parser.add_argument("--email", required=False)
    create_parser.add_argument("--role", required=True, choices=[r.value for r in UserRole])
    create_parser.add_argument("--password", required=True)
    create_parser.add_argument("--must-change", action="store_true")
    create_parser.set_defaults(func=handle_create)

    role_parser = user_subparsers.add_parser("set-role", help="Set user role")
    role_parser.add_argument("--username", required=True)
    role_parser.add_argument("--role", required=True, choices=[r.value for r in UserRole])
    role_parser.set_defaults(func=handle_set_role)

    deactivate_parser = user_subparsers.add_parser("deactivate", help="Deactivate a user")
    deactivate_parser.add_argument("--username", required=True)
    deactivate_parser.set_defaults(func=lambda args: handle_toggle_active(args, False))

    activate_parser = user_subparsers.add_parser("activate", help="Activate a user")
    activate_parser.add_argument("--username", required=True)
    activate_parser.set_defaults(func=lambda args: handle_toggle_active(args, True))

    reset_parser = user_subparsers.add_parser("reset-password", help="Reset user password")
    reset_parser.add_argument("--username", required=True)
    reset_parser.add_argument("--password", required=True)
    reset_parser.add_argument("--must-change", action="store_true")
    reset_parser.set_defaults(func=handle_reset_password)

    list_parser = user_subparsers.add_parser("list", help="List users")
    list_parser.add_argument("--role", choices=[r.value for r in UserRole], default=None)
    list_parser.add_argument("--active", type=lambda v: v.lower() == "true" if v else None, default=None)
    list_parser.add_argument("--query", default=None)
    list_parser.set_defaults(func=handle_list)

    return parser


def main(argv: list[str] | None = None) -> None:
    parser = build_parser()
    args = parser.parse_args(argv)
    if args.entity == "users":
        args.func(args)


if __name__ == "__main__":
    main()
