<script>
  import moment from "moment";
  import _ from "lodash";
  // personal store
  import { timeslots_data } from "../routes/_stores.js";

  $: dateRefreshed = _.get($timeslots_data, "dataRefreshedDate", []);

  $: dateRefreshMoment = dateRefreshed.reduce((acc, { retrieved_dateTime }) => {
    if (acc == false) return moment(retrieved_dateTime);
    else {
      const itemMoment = moment(retrieved_dateTime);
      return itemMoment.isBefore(acc) ? itemMoment : acc;
    }
  }, false);
  $: dateRefreshString = dateRefreshMoment
    ? `Last updated ${dateRefreshMoment.fromNow()}`
    : "";
</script>

<style>
  .page-footer {
    padding-top: 0;
  }
  .page-footer .container {
    display: flex;
  }
  .page-footer .container .author {
    flex: 1;
  }
</style>

<footer class="page-footer teal">
  <div class="footer-copyright">
    <div class="container">
      <div class="author">
        <a href="https://linjin.me" target="_blank">
          <span class="hide-on-small-only">Developed by</span>
          Jin - © {moment().format('YYYY')}
        </a>
      </div>
      <div
        class="informationLastUpdated tooltipped"
        data-position="top"
        data-tooltip={dateRefreshed
          .map(
            item =>
              `<strong>${item['facility.source']}</strong>: ${moment(
                item['retrieved_dateTime']
              ).fromNow()}`
          )
          .join('<br>')}>
        {dateRefreshString}
      </div>
      <!--<a class="grey-text text-lighten-4 right" href="#!">More Links</a>-->
    </div>
  </div>
</footer>
