import React from 'react';


export default function page({ params }: any) {

    const { id } = params;
    console.log('params id for specified comp...',id);
    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <h1 className="text-2xl font-bold mb-4">Complaints Page</h1>
            <p className="text-gray-600">This is the complaints page.</p>
        </div>
    );
}
