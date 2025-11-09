import { jsx as _jsx } from "react/jsx-runtime";
export function FileUpload({ onFileSelected, accept }) {
    const handleChange = (event) => {
        const file = event.target.files?.[0];
        if (file) {
            onFileSelected(file);
        }
    };
    return _jsx("input", { type: "file", accept: accept, onChange: handleChange, className: "block" });
}
