import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { DatabaseService } from '../services/DatabaseService';

interface DatabaseContextValue {
    db: DatabaseService;
}

const DatabaseContext = createContext<DatabaseContextValue | undefined>(undefined);

export const DatabaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const db = useMemo(() => new DatabaseService(), []);

    return (
        <DatabaseContext.Provider value={{ db }}>
            {children}
        </DatabaseContext.Provider>
    );
};

export const useDatabaseContext = () => {
    const context = useContext(DatabaseContext);
    if (!context) {
        throw new Error('useDatabaseContext must be used within a DatabaseProvider');
    }
    return context;
};
