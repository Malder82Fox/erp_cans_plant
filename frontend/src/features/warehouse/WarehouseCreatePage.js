import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "../../components/ui/card";
import * as api from "../../lib/apiClient";
import { BackButton } from "../shared/components/BackButton";
import { PartForm } from "./PartForm";
export default function WarehouseCreatePage() {
    const mutation = useMutation({
        mutationFn: (payload) => api.createPart(payload),
        onSuccess: () => {
            console.log("Part created");
        }
    });
    return (_jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(BackButton, {}), _jsx("h3", { className: "text-lg font-semibold", children: "Create Part" })] }), _jsx(CardContent, { children: _jsx(PartForm, { mode: "create", onSubmit: async (payload) => {
                        await mutation.mutateAsync(payload); // Promise<void>
                    }, isSubmitting: mutation.isPending }) })] }));
}
