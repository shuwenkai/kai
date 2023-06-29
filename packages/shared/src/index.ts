/** 判断是否是数组 */
export const isArray = (val: any) => {
    return Array.isArray(val)
}

/** 是否是对象 */
export const isObject = (val: any) => {
    return val !== null && typeof val === 'object'
}