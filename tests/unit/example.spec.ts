import { mount } from '@vue/test-utils'
import HomePage from '@/views/HomePage.vue'
import { describe, expect, test } from 'vitest'

describe('HomePage.vue', () => {
  test('renders home vue', () => {
    const wrapper = mount(HomePage, {
      global: {
        stubs: ['router-link']
      }
    })
    expect(wrapper.text()).toMatch('BovWeight CR')
  })
})
