import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: "#1E3A8A",
          borderRadius: 6,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1.5px solid #FBBF24",
        }}
      >
        {/* Shield lines representing a research document */}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2L3 6V12C3 16.5 7.5 20.7 12 22C16.5 20.7 21 16.5 21 12V6L12 2Z"
            fill="#1E3A8A"
            stroke="#FBBF24"
            strokeWidth="1.5"
          />
          <path d="M8 11H16" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M8 14H16" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M8 17H12" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
