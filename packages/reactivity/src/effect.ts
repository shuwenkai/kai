
/** 当前正在执行的依赖 */
export let activeEffect = undefined

/** 清理effect */
function cleanupEffect(effect) {
    const { deps } = effect
    for (let i = 0; i < deps.length; i++) {
        deps[i].delete(effect)
    }
    effect.deps.length = 0
}

/**
 * 依赖收集类
 */
class ReactiveEffect {
    parent = undefined
    /** 定义一个依赖数组，记录effect对应哪些依赖 */
    deps = []
    /**
     * 
     * @param fn 
     */
    constructor(public fn: Function) { }
    // public fn:Function
    // constructor(fn:Function){ this.fn = fn}


    /** 执行传入的函数 */
    run() {
        try {
            activeEffect = this
            cleanupEffect(this) // 将上一次依赖收集清除
            return this.fn()
        } finally {
            // 执行完传入的函数之后，将变量置为null，
            // 如果在effect方法外部使用了reactive定义的变量，那么不会被监听，因为activeEffect被设置为null了
            activeEffect = this.parent // 执行完成后将当前activeEffect还原为effect父节点，解决嵌套effect
            this.parent = undefined
        }
    }
}


export function effect(fn: Function) {
    const _effect = new ReactiveEffect(fn)
    _effect.run()
}

/** 利用weakmap记录依赖关系 */
const targetMap = new WeakMap()

/** 依赖收集，关联对象，属性以及_effect */
export function track(target, key) {
    // 只有在effect方法中改变了reactive对象，才会被进行依赖收集，因为此时activeEffect不是undefined
    if (!activeEffect) {
        return
    }

    // target对象所有的依赖信息，即在哪些地方被使用
    let depsMap = targetMap.get(target)
    if (!depsMap) {
        targetMap.set(target, depsMap = new Map())
    }

    // 找到属性对应的_effect
    let deps = depsMap.get(key)
    if (!deps) {
        depsMap.set(key, deps = new Set())
    }

    // 如果 _effect 已经被收集过了，则不再收集
    let shouldTrack = !deps.has(activeEffect)
    if (shouldTrack) {
        deps.add(activeEffect)
        // 在effect中记录所有依赖，方便后续清理
        activeEffect.deps.push(deps)
    }
}

export function trigger(target, key, value, oValue) {
    let depsMap = targetMap.get(target)
    if (!depsMap) return
    // key 属性对应的所有effect集合，是个Set
    const dep = depsMap.get(key) // 属性对应的所有effect集合，是个set
    // 9-3 进行一次拷贝，防止自己删除元素的同时，自己添加，造成死循环
    const effects = [...dep]
    if (effects) {
        effects.forEach((effect: ReactiveEffect) => {
            /** 执行每个effect中的run方法；正在执行的effect，不要多次执行，防止死循环
             * @example
             * ```javascript
                effect(() => {
                    // 每次修改state.name都是新的随机数
                    state.name = Math.random()
                    app.innerHTML = state.name + ':' + state.age
                })
             * ```
             */
            if (effect !== activeEffect) {
                effect.run()
            }
        })
    }
}