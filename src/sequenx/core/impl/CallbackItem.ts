module Sequenx
{
    export class CallbackTask implements ISequenceTask
    {

        constructor(public action: (done?: () => void) => void, public message?: string)  { }

        start(cb: () => void)
        {
            if (this.action.length > 0)
                this.action(cb);
            else
            {
                this.action();
                cb();
            }
        }

        toString(): string
        {
            return "[Item] msg %s action %s", this.message, (this.action != null).toString();
        }
    }
}