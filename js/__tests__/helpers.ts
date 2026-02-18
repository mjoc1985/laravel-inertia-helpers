import { defineComponent, h } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'

/**
 * Mount a composable inside a real component so that Vue lifecycle
 * hooks (onUnmounted, watch, etc.) work correctly.
 */
export function withSetup<T>(setup: () => T): { result: T; wrapper: VueWrapper } {
    let result!: T

    const wrapper = mount(
        defineComponent({
            setup() {
                result = setup()
                return () => h('div')
            },
        }),
    )

    return { result, wrapper }
}
