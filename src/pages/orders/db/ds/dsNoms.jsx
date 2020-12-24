import  CustomStore  from 'devextreme/data/custom_store';

const cls_name='noms'

export const nomsDataSource = new CustomStore({

    key: "ref", 
    
    byKey: (ref) => {

      if (!ref) return {ref:ref,name:''}
      console.log("=2-Noms=:", ref);
      //var res =  this.load({lookUp:keyf})
      const q = `{${cls_name} (ref:"${ref}" ) { ref name } }`;
      
      return fetch("http://localhost:4000/", {
        method: "POST",
        body: JSON.stringify({ query: q }),
        headers: {
          "Content-Type": "application/json",
        },
      })
//        .then(handleErrors)
        .then((response) => response.json())
        .then((response) => { 
            const res = (response.data[cls_name].length===0)?{ref:ref,name:''}:response.data[cls_name][0]
            console.log("=res:", res);   
            return res
          })
    },


     load: (options) => {
      console.log("=Noms=Options:" + JSON.stringify(options));

      let _search =
        options.searchOperation && options.searchValue
          ? ', nameContaine:"' + options.searchValue + '"'
          : "";

      let lookUp = ""; //= (options.lookUp)? ', lookup:"'+options.lookUp+'"':''

      let _filter=''
      if (options.filter && options.filter.length > 0) {
          _filter=' filter:['
          let ofilt = options.filter
          var i = 0;
          if (Array.isArray(options.filter[0])){
            ofilt.forEach(element => {
                if (Array.isArray(element) && element[2].length >2)
                  _filter += ( i>0?`,`:` `) + `{field:"${element[0]}", expr:"${element[1]}", value:"${element[2]}"}`
                  i++
                }
              )      
          }
          else{
            if (options.filter[2].length >2)
            _filter += ` {field:"${options.filter[0]}", expr:"${options.filter[1]}", value:"${options.filter[2]}"}`
          } 

          _filter +='] '

      }

      var _offset=''
      if (options.skip)
        _offset = ` offset:${options.skip}`

      const q = `{${cls_name} (limit:50 ${lookUp} ${_search} ${_filter} ${_offset}) { ref name }}`
             console.log(q) 

      return fetch("http://localhost:4000/", {
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
          console.log(response.data[cls_name])
          return {
            data: response.data[cls_name]
          };
        });
    },
    insert: (val) => {
      console.log("4:");
      return new Promise((resolve, reject) => {
        resolve([{ text: "Test insert" }]);
      })
    },
    remove: (key) => {
      console.log("5:");
      return new Promise((resolve, reject) => {
        resolve();
      })
    },
    update: (dat, values) => {
      console.log("6:");
      return new Promise((resolve, reject) => {
        resolve([{ text: "Test insert" }]);
      })
    },
     
  });



