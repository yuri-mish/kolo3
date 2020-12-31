import CustomStore from "devextreme/data/custom_store";

export const partnerDataSource = new CustomStore({
  key: "ref",

  byKey: (ref) => {
    if (!ref) return { ref: ref, name: "" };
    console.log("=2:", ref);
    //var res =  this.load({lookUp:keyf})
    const q = `{partners (ref:"${ref}" ) { ref name edrpou } }`;

    return (
      fetch("http://localhost:4000/", {
        method: "POST",
        body: JSON.stringify({ query: q }),
        headers: {
          "Content-Type": "application/json",
        },
      })
        //        .then(handleErrors)
        .then((response) => response.json())
        .then((response) => {
          const res =
            response.data.partners.length === 0
              ? { ref: ref, name: "" }
              : response.data.partners[0];
          console.log("=res:", res);
          return res;
        })
    );
  },

  load: (options) => {
    console.log("=Options:" + JSON.stringify(options));

    let _search =
      options.searchOperation && options.searchValue
        ? ', nameContaine:"' + options.searchValue + '"'
        : "";

    let lookUp = ""; //= (options.lookUp)? ', lookup:"'+options.lookUp+'"':''

    let _filter = "";
    if (options.filter && options.filter.length > 0) {
      _filter = " filter:[";
      let ofilt = options.filter;
      var i = 0;
      if (Array.isArray(options.filter[0])) {
        ofilt.forEach((element) => {
          if (Array.isArray(element) && element[2].length > 2)
            _filter +=
              (i > 0 ? `,` : ` `) +
              `{field:"${element[0]}", expr:"${element[1]}", value:"${element[2]}"}`;
          i++;
        });
      } else {
        if (options.filter[2].length > 2)
          _filter += ` {field:"${options.filter[0]}", expr:"${options.filter[1]}", value:"${options.filter[2]}"}`;
      }

      _filter += "] ";
    }

    var _offset = "";
    if (options.skip) _offset = ` offset:${options.skip}`;

    var _limit = 50;
    if (options.take) _limit = options.take;

    var _qT = ``;
    if (options.requireTotalCount)
      _qT = `totalcount:partners (limit:1 ${_search} ${_filter} totalCount:1)  { totalcount} `;

    const q = `{ ${_qT} partners (limit:${_limit} ${lookUp} ${_search} ${_filter} ${_offset}) { ref name edrpou}}`; //name edrpou } }`;

    console.log(q);

    return (
      fetch("http://localhost:4000/", {
        method: "POST",
        body: JSON.stringify({ query: q }),
        headers: {
          "Content-Type": "application/json",
        },
      })
        //   .then(handleErrors)
        .then((response) => {
          return response.json();
        })
        .then((response) => {
          //console.log(response.data.partners);
          return {
            data: response.data.partners,
            totalCount: options.requireTotalCount
              ? response.data.totalcount[0].totalcount
              : undefined,
          };
        })
    );
  },
  insert: (val) => {
    console.log("4:");
    return new Promise((resolve, reject) => {
      resolve([{ text: "Test insert" }]);
    });
  },
  remove: (key) => {
    console.log("5:");
    return new Promise((resolve, reject) => {
      resolve();
    });
  },
  update: (dat, values) => {
    console.log("6:");
    return new Promise((resolve, reject) => {
      resolve([{ text: "Test insert" }]);
    });
  },
});
