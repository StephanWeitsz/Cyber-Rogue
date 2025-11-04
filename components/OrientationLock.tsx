import React from 'react';

export const OrientationLock: React.FC = () => {
    return (
        <div className="fixed inset-0 bg-black z-[100] flex items-center justify-center lg:hidden portrait:flex landscape:hidden">
            <div className="text-white text-center p-8">
                <h1 className="text-2xl font-bold mb-4">Please Rotate Your Device</h1>
                <p>This experience is best viewed in landscape mode.</p>
            </div>
        </div>
    );
};
