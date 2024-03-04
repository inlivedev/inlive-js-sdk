export declare namespace SharedType {
  type ObjectLiteral = {
    [key: string]: any
  }

  type DeepPartial<Thing> = Thing extends any[]
    ? Thing
    : { [Key in keyof Thing]?: DeepPartial<Thing[Key]> }
}
