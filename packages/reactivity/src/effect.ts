
type EffectFn = () => void

export let activeEffect = null
class ReactiveEffect {

    parent: ReactiveEffect = null

    constructor(public fn: EffectFn, public s?) { }

    run() {
        try {
            activeEffect = this
            this.fn()
        } finally {
            // activeEffect = null
            activeEffect = this.parent
            this.parent = null
        }
        console.log('activeEffect', activeEffect)
    }
}

/*
 effect 作用，依赖收集，触发更新
 reactive时建立关系
 get 获取值时告诉effect有地方引用了，
 set 设置值时通知所有引用key的地方改变了
 存储关系 targetMap{target ==> depsMap{ key===> deps(Set(effect)) } }

*/
/**
 * 依赖收集核心函数
 * @param fn 
 * @param options 
 */
export function effect(fn: EffectFn, options?) {
    const _effect = new ReactiveEffect(fn, options)

    _effect.run()
}