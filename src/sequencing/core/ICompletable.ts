module Sequenx
{
    export interface ICompletable
    {
        onCompleted(action: () => void)
    }
}
