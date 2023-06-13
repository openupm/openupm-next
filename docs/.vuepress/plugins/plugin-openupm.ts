// This plugin builds openupm's dynamic pages.
import { getDirname, path } from '@vuepress/utils'
import { useStore } from 'vuex';

const __dirname = getDirname(import.meta.url)

export default (options) => {
  return {
    name: 'vuepress-plugin-openupm',
  }
}