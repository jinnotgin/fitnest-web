<script>
  import { constants } from "../routes/_stores.js";
  export let segment;
</script>

<style>
  .nav-wrapper {
    margin: 0 20px;
    height: 64px;
    user-select: none;
  }
  .brand-logo img {
    height: 40px;
    margin-top: 8px;
  }

  @media only screen and (min-width: 600px) {
    .brand-logo img {
      height: 48px;
      margin-top: 8px;
    }
  }
</style>

<nav class="teal">
  <div class="nav-wrapper">
    <a class="brand-logo" href="/">
      <img src="/images/fitnest-logo-white.png" />
    </a>
    <ul class="right hide-on-med-and-down">
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
