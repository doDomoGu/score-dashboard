import type { IPlayer } from "./player";

export type TournamentCategory = "qiaoma" | "riichi";

export interface ITournament {
  category: TournamentCategory; // 赛事类型
  session: number; // 第几届赛事
  champion: IPlayer; // 冠军玩家
  date: string;
}
