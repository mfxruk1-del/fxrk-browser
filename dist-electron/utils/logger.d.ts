export declare const logger: {
    debug: (message: string, ...args: unknown[]) => void;
    info: (message: string, ...args: unknown[]) => void;
    warn: (message: string, ...args: unknown[]) => void;
    error: (message: string, ...args: unknown[]) => void;
    browser: {
        debug: (msg: string, ...a: unknown[]) => void;
        info: (msg: string, ...a: unknown[]) => void;
        warn: (msg: string, ...a: unknown[]) => void;
        error: (msg: string, ...a: unknown[]) => void;
    };
    privacy: {
        debug: (msg: string, ...a: unknown[]) => void;
        info: (msg: string, ...a: unknown[]) => void;
        warn: (msg: string, ...a: unknown[]) => void;
        error: (msg: string, ...a: unknown[]) => void;
    };
    auth: {
        debug: (msg: string, ...a: unknown[]) => void;
        info: (msg: string, ...a: unknown[]) => void;
        warn: (msg: string, ...a: unknown[]) => void;
        error: (msg: string, ...a: unknown[]) => void;
    };
    phone: {
        debug: (msg: string, ...a: unknown[]) => void;
        info: (msg: string, ...a: unknown[]) => void;
        warn: (msg: string, ...a: unknown[]) => void;
        error: (msg: string, ...a: unknown[]) => void;
    };
    db: {
        debug: (msg: string, ...a: unknown[]) => void;
        info: (msg: string, ...a: unknown[]) => void;
        warn: (msg: string, ...a: unknown[]) => void;
        error: (msg: string, ...a: unknown[]) => void;
    };
};
export default logger;
