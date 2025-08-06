import type { IPlayer } from "./player";

export interface IRound {
  number: number; // 第几轮
  players: IPlayer[]; // 参与玩家列表
  scores: number[]; // 每个玩家的分数
}
