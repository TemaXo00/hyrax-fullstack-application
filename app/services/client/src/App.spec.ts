import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import App from './App.vue';

describe('App', () => {
  it('renders the router outlet and toast host', () => {
    const wrapper = mount(App, {
      global: { stubs: { RouterView: true, ToastHost: true } },
    });

    expect(wrapper.find('router-view-stub').exists()).toBe(true);
    expect(wrapper.find('toast-host-stub').exists()).toBe(true);
  });
});
