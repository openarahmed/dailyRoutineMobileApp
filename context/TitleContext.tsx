import React, { createContext, ReactNode, useContext, useState } from 'react';

// Define the shape of the context data
interface TitleContextType {
    title: string;
    setTitle: (title: string) => void;
}

// Create the context with a default undefined value
const TitleContext = createContext<TitleContextType | undefined>(undefined);

/**
 * Custom hook to use the TitleContext.
 * Throws an error if used outside of a TitleProvider.
 */
export const useTitle = (): TitleContextType => {
    const context = useContext(TitleContext);
    if (!context) {
        throw new Error('useTitle must be used within a TitleProvider');
    }
    return context;
};

/**
 * Provider component that wraps your app and provides the title state.
 */
export const TitleProvider = ({ children }: { children: ReactNode }) => {
    // State to hold the current title, with a default value
    const [title, setTitle] = useState('My Routine'); 

    const value = { title, setTitle };

    return (
        <TitleContext.Provider value={value}>
            {children}
        </TitleContext.Provider>
    );
};
