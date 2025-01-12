import React from 'react';

const Unauthorized = () => {
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
            <h1 className="text-4xl font-bold text-red-600 mb-4">Unauthorized Access</h1>
            <p className="text-lg text-gray-700 mb-6">You do not have permission to view this page.</p>
            <a
                href="/login"
                className="bg-teal-500 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded"
            >
                Go to Login
            </a>
        </div>
    );
};

export default Unauthorized;
