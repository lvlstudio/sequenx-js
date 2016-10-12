module Sequenx
{
    export interface Sequence
    {
        doLapse(action: (lapse: Lapse) => void, message?: string):Sequence
    }

    Sequence.prototype.doLapse = function (action: (lapse: Lapse) => void, message: string = "Lapse")
    {
        const lapse = new Lapse(this.createChildLog(message));
        this.do((done) =>
        {
            action(lapse);
            lapse.start(done);
        });
        return this;
    };
}