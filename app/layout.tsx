import React from 'react';
import Link from 'next/link';
import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div>
          
          <main>
            {children} 
          </main>

        </div>
      </body>
    </html>
  );
}
