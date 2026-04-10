export const metadata = {
  title: "ForgeID — Identity Infrastructure for AI Agents",
  description:
    "It's not IAM with agent support. It's identity infrastructure built for agents. AuthN + AuthZ + Agent Identity. By IntelliForge AI.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Figtree:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
