import { Store } from 'vuex'

declare module '@vue/runtime-core' {
  interface State {
    packagesExtra: any,
    recentPackages: any[],
    preferHorizontalLayout: boolean,
    siteInfo: any,
    packageListSort: string,
  }

  interface ComponentCustomProperties {
    $store: Store<State>
  }
}