export function generateUniqueId(): string {
    return 'id-' + Math.random().toString(36).substr(2, 9);
}

export function isEmpty(obj: object): boolean {
    return Object.keys(obj).length === 0;
}

export function deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
}

export function formatDate(date: Date, format: string): string {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return new Intl.DateTimeFormat('en-US', options).format(date);
}