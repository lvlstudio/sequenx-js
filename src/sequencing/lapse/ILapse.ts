
module Sequenx
{
    export interface ILapse extends IDisposable
    {
        sustain(name?: string): IDisposable;
        createChildLog(name: string): ILog;
        name: string;

        //extensions
        child(action: (lapse: ILapse) => void, message?: string): void;
        sequence(action: (seq: Sequence) => void, message?: string): Sequence;
    }
}
