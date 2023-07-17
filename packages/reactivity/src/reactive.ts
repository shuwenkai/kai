import { isObject } from "@vue/shared"
import { activeEffect } from "."

enum ReactiveFlags {
    IS_REACTIVE = '__v_isReactive'
}

const reactiveWeakMap = new WeakMap()

const mutableHandlers = {
    get(target, key, receiver) {
        console.log(activeEffect, 'activeEffect')
        if (key === ReactiveFlags.IS_REACTIVE) {
            return true
        }
        return Reflect.get(target, key, receiver)
    },
    set(target, key, value, receiver) {
        Reflect.set(target, key, value, receiver)
        return true
    }
}


export function reactive<T extends object>(target: T) {
    if (!isObject(target)) {
        if (__DEV__) {
            console.warn('reactive.ts: 传入的不是一个object')
        }
        return
    }

    // 传入的对象是否已经被代理，是则直接返回被代理的对象
    const exsitingProxy = reactiveWeakMap.get(target)
    if (exsitingProxy) {
        return exsitingProxy
    }

    // 如果传入的是一个reactive响应性对象，不进行代理直接返回
    // 如果传入的是普通对象，此时 target.__v_isReactive 的值为undefined,直接进行后续逻辑进行代理
    // 如果传入的是已经被reactive代理过的对象，此时 target.__v_isReactive 的值为true，
    // 因为此时获取__v_isReactive属性会进入到mutableHandlers中get函数，get函数里面进行了判断 key为__v_isReactive直接返回true
    if (target[ReactiveFlags.IS_REACTIVE]) {
        return target
    }

    const proxy = new Proxy(target, mutableHandlers)
    reactiveWeakMap.set(target, proxy)
    return proxy
}