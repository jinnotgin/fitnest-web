self.importScripts(
  "https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.24.0/moment.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.15/lodash.min.js"
);
self.addEventListener(
  "message",
  function(e) {
    const {
      $timeslots_data,
      $timeRangeToSearch,
      $dateToSearch,
      $cardsToggle
    } = e.data;

    const index_timeslots_data = timeslotData => {
      let output = {
        ...timeslotData,
        totalFacilitiesInDesiredTimePeriods: 0
      };
      //const toUpdate_cardsToggle = {};

      // compute if each timeslot fits in timeRangeToSearch
      const [
        desiredStartTime_string,
        desiredEndTime_string
      ] = $timeRangeToSearch;

      const start_dayString = moment($dateToSearch).format("YYYY-MM-DD");
      const desired_startMoment = moment(
        `${start_dayString} ${desiredStartTime_string}`,
        "YYYY-MM-DD h:mm a"
      );
      const desired_endMoment = moment(
        `${start_dayString} ${desiredEndTime_string}`,
        "YYYY-MM-DD h:mm a"
      );
      Object.values(_.get(output, "facilitySportDay", {})).map(
        ({ _id, courts, facility, sport_source_id, date }) => {
          // cardsToggle
          // if new facilities are found, add them to cardsToggle
          //console.log(facility);
          /*if ($cardsToggle[facility._id] == undefined)
            toUpdate_cardsToggle[facility._id] = false;*/

          // facilitySportDay
          // add a url to facilitySportDay
          const { source, source_id } = facility;
          let url = "#";
          if (source == "ActiveSG") {
            url = `https://members.myactivesg.com/facilities/view/activity/${sport_source_id}/venue/${source_id}?time_from=${moment(
              date
            ).unix()}`;
          } else if (source == "onePA") {
            url = `https://www.onepa.sg/facilities/${sport_source_id}`;
          }
          output.facilitySportDay[_id].url = url;

          output.availabilitySummary[_id].totalInDesiredTimeRange = 0;
          Object.entries(courts).map(([courtName, court_allSlots]) => {
            output.availabilitySummary[_id].courts[
              courtName
            ].totalInDesiredTimeRange = 0;
            Object.entries(court_allSlots).map(([slotName, slotData]) => {
              const { startTime, endTime, status } = slotData;

              const startMoment = moment(startTime);
              const endMoment = moment(endTime);

              const isInDesiredTimeRange =
                startMoment.isSameOrAfter(desired_startMoment) &&
                endMoment.isSameOrBefore(desired_endMoment);

              // update slot itself in facilitySportDay
              output.facilitySportDay[_id].courts[courtName][
                slotName
              ].isInDesiredTimeRange = isInDesiredTimeRange;

              const isAvailableInDesiredTimeRange =
                isInDesiredTimeRange && status > 0;

              // update court summary data in availabilitySummary
              output.availabilitySummary[_id].courts[
                courtName
              ].totalInDesiredTimeRange += isAvailableInDesiredTimeRange;

              // update facilitySportDay summary data in availabilitySummary
              output.availabilitySummary[
                _id
              ].totalInDesiredTimeRange += isAvailableInDesiredTimeRange;

              // update totalFacilitiesInDesiredTimePeriods
              output.totalFacilitiesInDesiredTimePeriods += isAvailableInDesiredTimeRange;
            });
          });
        }
      );

      // determine general sorting order of all items
      // account for facilities that have been toggled on already
      const toSort_untoggled = [];
      const toSort_toggled = [];
      Object.keys(output.availabilitySummary).map(facilitySportDay_id => {
        const facility_id =
          output.facilitySportDay[facilitySportDay_id].facility._id;

        if ($cardsToggle[facility_id]) toSort_toggled.push(facilitySportDay_id);
        else toSort_untoggled.push(facilitySportDay_id);
      });
      const sortingFunction = (a, b) =>
        output.availabilitySummary[b].totalInDesiredTimeRange -
        output.availabilitySummary[a].totalInDesiredTimeRange;

      output.sortingOrder = [
        ...toSort_toggled.sort(sortingFunction),
        ...toSort_untoggled.sort(sortingFunction)
      ];

      /*cardsToggle.update(item => {
        return { ...item, ...toUpdate_cardsToggle };
      });*/

      //console.log(output);
      return output;
    };

    const processedData = index_timeslots_data($timeslots_data);

    self.postMessage(processedData);
    self.close();
  },
  false
);
