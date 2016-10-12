/// <reference path="./ILog.ts"/>

module Sequenx {
    export class Log implements ILog {
        private static PathSeparator: string = "     ";
        private static MessageSeparator: string = "     ";
        private static StartSuffix: string = " [START]";
        private static EndSuffix: string = " [END]";

        private static s_nextId: number = 1;
        public static isEnabled: boolean = true;

        private _parent: Log;
        private _name: string;
        private _id: number;
        private _fullName: string;
        private _isDisposed: boolean;

        get name(): string {
            return this._name;
        }

        set name(value: string) { }

        constructor(name: string, parent?: Log) {
            this._parent = parent;
            this._name = name != null ? name : "";
            this._id = Log.s_nextId++;

            if (Log.isEnabled)
                console.log(this.fullName + Log.StartSuffix);
        }

        public toString(): string {
            return this.fullName;
        }

        public dispose(): void {
            if (this._isDisposed)
                return;

            if (Log.isEnabled)
                console.log(this.fullName + Log.EndSuffix);

            this._isDisposed = true;
        }

        public createChild(name: string): ILog {
            return new Log(name, this);
        }

        public info(message: string, ...params: any[]): void {
            if (Log.isEnabled)
                console.log(this.format(message, params));
        }

        public warning(message: string, ...params: any[]): void {
            console.warn(this.format(message, params));
        }

        public error(message: string, ...params: any[]): void {
            console.error(this.format(message, params));
        }

        get fullName(): string {
            if (this._fullName == null) {
                if (this._parent != null)
                    this._fullName = this._parent.fullName + Log.PathSeparator + this.getNameWithId();
                else
                    this._fullName = this.getNameWithId();
            }

            return this._fullName;
        }

        private getNameWithId(): string {
            return "(" + this._id + ") " + this._name;
        }

        private format(message: string, params: any[]): string {
            if (message && params != null && params.length > 0)
                message = this.strFormat(message, params);

            return this.fullName + Log.MessageSeparator + message;
        }

        private strFormat(str: string, ...params: any[]) {
            var args = params;
            return str.replace(/{(\d+)}/g, function (match, number) {
                return typeof args[number] != 'undefined' ? args[number] : match;
            });
        }
    }
}