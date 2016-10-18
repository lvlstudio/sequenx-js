module Sequenx
{
    export interface ISequenceTask
    {
        message?: string;
        start(onComplete?: () => void);
    }
}