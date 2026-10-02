import { useEffect, useState } from "react";
import client from "../api/client";

// Photos are private, so they can't be a plain <img src>. Fetch them with the
// auth cookie and show them from a temporary object URL instead.
export default function ApplicantPhoto({
  applicationId,
  name,
  size = 72,
}: {
  applicationId: string;
  name: string;
  size?: number;
}) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    client
      .get(`/applications/${applicationId}/photo`, { responseType: "blob" })
      .then(({ data }) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(data);
        setSrc(objectUrl);
      })
      .catch(() => setSrc(null));

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [applicationId]);

  const style = { width: size, height: size };

  return src ? (
    <img className="applicant-photo" style={style} src={src} alt={`${name}'s photo`} />
  ) : (
    <div className="applicant-photo applicant-photo-fallback" style={style}>
      {name.charAt(0).toUpperCase() || "?"}
    </div>
  );
}
