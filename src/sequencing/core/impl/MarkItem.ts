module Sequenx
{
    export class MarkTask implements ISequenceTask
    {
        public message: string;

        private _callback: () => void;

        constructor(public marker: any, message?: string)
        {
            this.message = message;
        }

        start(cb: () => void)
        {
            cb();
        }

        public toString(): string
        {
            return "[Item] msg %s mark %s", this.message, this.marker;
        }
    }
}