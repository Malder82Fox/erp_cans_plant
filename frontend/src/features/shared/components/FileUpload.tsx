import { type ChangeEvent } from "react";

interface FileUploadProps {
  onFileSelected: (file: File) => void;
  accept?: string;
}

export function FileUpload({ onFileSelected, accept }: FileUploadProps): JSX.Element {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelected(file);
    }
  };

  return <input type="file" accept={accept} onChange={handleChange} className="block" />;
}
