/** 判断是否是数组 */
export const isArray = (val: any): val is Array<any> => {
    return Array.isArray(val)
}

/** 是否是对象 */
export const isObject = (val: any): val is object => {
    return val !== null && typeof val === 'object'
}