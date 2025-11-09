import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader } from "../../components/ui/card";
import * as api from "../../lib/apiClient";
import { BackButton } from "../shared/components/BackButton";
import { PartForm } from "./PartForm";
export default function WarehouseEditPage() {
    const { id } = useParams();
    const partQuery = useQuery({
        queryKey: ["warehouse", "part", id],
        queryFn: () => api.getPart(Number(id)),
        enabled: !!id
    });
    const mutation = useMutation({
        mutationFn: (payload) => api.updatePart(Number(id), payload),
        onSuccess: () => {
            console.log("Part updated");
        }
    });
    return (_jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(BackButton, {}), _jsx("h3", { className: "text-lg font-semibold", children: "Edit Part" })] }), _jsx(CardContent, { children: _jsx(PartForm, { initial: partQuery.data, mode: "edit", onSubmit: async (payload) => {
                        await mutation.mutateAsync(payload); // Promise<void>
                    }, isSubmitting: mutation.isPending }) })] }));
}
