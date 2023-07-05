import { isArray, isObject } from "@vue/shared"
import { activeEffect, track, trigger, effect } from "./effect"

/** 
 * 区别于map的是weakmap只能使用object作为键
 * 利用weakmap，定义一个缓存表，查看对象是否已经做了响应式代理， */
const reactiveWeak = new WeakMap()

const enum ReactiveFlags {
    IS_REACTIVE = '__v_isReactive'
}

const mutableHandlers = {
    get(target: any, key: any, receiver: any) {
        // ** 如果是已经被代理那么则会触发这里，返回true，配合reactive函数
        if(key === ReactiveFlags.IS_REACTIVE){
            return true
        }
        const res = Reflect.get(target, key, receiver)
        console.log(`获取${key}属性, 触发依赖收集track`)
        // 依赖收集
        track(target, key)
        return res
    },
    set(target: any, key: any, value: any, receiver: any) {
        let oValue = target[key]
        Reflect.set(target, key, value, receiver)
        // 新旧值不一样， 触发更新
        if(oValue !== value){        
            console.log(`${key}属性的值更新了, 派发更新`)
            trigger(target, key, value, oValue)
        }
        return true
    }
}

export function reactive(target: object) {
    if(!isObject(target)){
        return
    }
    // 在缓存中查找到该对象已被代理，则直接返回
    const existingProxy = reactiveWeak.get(target)
    if(existingProxy) {
        return existingProxy
    }

    // ** 如果传入的对象不是被reactive代理的，那么target[ReactiveFlags.IS_REACTIVE]为undefined
    // 如果是那么就会触发代理中对象中的get
    // 判断传入的是否是一个被reactive代理过的对象，是则返回
    if(target[ReactiveFlags.IS_REACTIVE]){
        // console.log('传入了一个被代理过的对象，返回对象本身')
        return target
    }
    // 否则正常new proxy
    const proxy = new Proxy(target, mutableHandlers)
    // 然后进行缓存
    reactiveWeak.set(target, proxy)
    return proxy
}




export {
    isArray,
    effect
}