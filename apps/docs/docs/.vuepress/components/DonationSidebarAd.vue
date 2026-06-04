<template>
  <section class="sidebarad-section ml-2 mr-2 mt-2">
    <div class="columns">
      <div class="column col-12">
        <a class="donation-sidebar-link" href="/support/#help-the-community-grow">
          Donate to OpenUPM with love! ❤️
        </a>
      </div>
    </div>
  </section>
</template>
<style lang="scss" scoped>
@use '@/styles/palette' as *;

.donation-sidebar-link {
  align-items: center;
  color: $primary-color;
  display: inline-flex;
  font-size: 0.72rem;
  font-weight: 600;
  line-height: 1.25;
  padding: 0.1rem 0;
  text-decoration: none;

  &:hover {
    color: $primary-color;
    text-decoration: none;
  }
}

:is(.dark, [data-theme='dark']) {
  .donation-sidebar-link {
    color: $primary-color-light;

    &:hover {
      color: $primary-color-light;
    }
  }
}
</style>
