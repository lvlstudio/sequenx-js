sequenx-js
==========
Typescript version of [Sequenx](https://github.com/Silphid/Sequenx)

Example
-------
Basic example
```Typescript

var sequence = new Sequenx.Sequence('Sequence')
    .do(() => console.log("sync task"));
    .doWait(1000); //wait 1 second
    .do((done) => setTimeout(() => console.log("async task"), 500));
    .start(() => console.log("complete"));

```

API
---
Coming soon