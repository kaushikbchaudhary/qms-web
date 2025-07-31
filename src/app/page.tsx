'use client';
import React from 'react';
export default function Home() {
  return (
      <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
          <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
              <div className="text-center sm:text-left">
                  <h1 className="text-4xl font-bold text-gray-800 mb-4">QMS-Web Application</h1>
                  <h2 className="text-2xl font-semibold text-gray-600 mb-6">Coming Soon</h2>
                  <p className="text-lg text-gray-500 max-w-lg">
                      We're working hard to bring you a powerful Quality Management System.
                      This application will help you streamline your quality processes and
                      improve efficiency across your organization.
                  </p>
                  <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100 max-w-md">
                      <p className="text-blue-800">
                          Stay tuned for updates! Our team is currently building this page
                          with all the features you need.
                      </p>
                  </div>
              </div>
          </main>
      </div>
  );
}
