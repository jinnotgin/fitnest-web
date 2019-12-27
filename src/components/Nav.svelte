<script>
  export let segment;
</script>

<style>
  .nav-wrapper {
    margin: 0 20px;
    height: 64px;
  }
</style>

<nav class="teal">
  <div class="nav-wrapper">
    <span class="brand-logo">FitNest</span>
    <ul id="nav-mobile" class="right hide-on-med-and-down">
      <li>
        <a class:selected={segment === undefined} href=".">home</a>
      </li>
      <li>
        <a class:selected={segment === 'about'} href="about">about</a>
      </li>

      <!-- for the blog link, we're using rel=prefetch so that Sapper prefetches
		     the blog data when we hover over the link or tap it on a touchscreen -->
      <li>
        <a rel="prefetch" class:selected={segment === 'faq'} href="faq">faq</a>
      </li>
    </ul>
  </div>
</nav>
