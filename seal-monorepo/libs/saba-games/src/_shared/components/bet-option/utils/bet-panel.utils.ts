import { IBetPanelConfig, IBetPanelState, IBetPanelPosition } from '../types/bet-panel.types';
import { calculateMinMaxAmount } from '../../../utils/betting-util';
import {
    SE_DIE_CHOICES,
    BACCARAT_CHOICES,
    FISH_PRAWN_CRAB_CHOICES,
    COLOR_GAME_CHOICES
} from '../../../../games/constants/saba-club';
import sedieIcon from '../../../../assets/game-icons/sedie.png';
import vipSedieIcon from '../../../../assets/game-icons/vip-sedie.png';
import bigSmallIcon from '../../../../assets/game-icons/big-small.png';
import baccaratIcon from '../../../../assets/game-icons/game-icon-10.png';
import fishPrawnCrabIcon from '../../../../assets/game-icons/fish-prawn-crab.png';
import colorGameIcon from '../../../../assets/game-icons/color-game.png';
import coinTossIcon from '../../../../assets/game-icons/coin-toss.png';
import {
    SE_DIE_GAME_NAMESPACE,
    VIP_SE_DIE_GAME_NAMESPACE,
    UNBALANCED_BIG_SMALL_4_GAME_NAMESPACE,
    BACCARAT_GAME_NAMESPACE,
    FISH_PRAWN_CRAB_GAME_NAMESPACE,
    COLOR_GAME_NAMESPACE,
    COIN_TOSS_GAME_NAMESPACE,
    VIVA88_SITE_ID,
    SABA_GAMES,
    VGAMING
} from '../../../../../constant/app';

export const isSpecialBetChoice = (betChoice: string): boolean => {
    return [
        SE_DIE_CHOICES.RED2,
        BACCARAT_CHOICES.PLAYER_PAIR,
        BACCARAT_CHOICES.BANKER_PAIR,
        FISH_PRAWN_CRAB_CHOICES.PRAWN,
        FISH_PRAWN_CRAB_CHOICES.ROOSTER,
        COLOR_GAME_CHOICES.PINK,
        COLOR_GAME_CHOICES.GREEN
    ].includes(betChoice);
};

const GAME_ICON_MAP = {
    [SE_DIE_GAME_NAMESPACE]: sedieIcon,
    [VIP_SE_DIE_GAME_NAMESPACE]: vipSedieIcon,
    [UNBALANCED_BIG_SMALL_4_GAME_NAMESPACE]: bigSmallIcon,
    [BACCARAT_GAME_NAMESPACE]: baccaratIcon,
    [FISH_PRAWN_CRAB_GAME_NAMESPACE]: fishPrawnCrabIcon,
    [COLOR_GAME_NAMESPACE]: colorGameIcon,
    [COIN_TOSS_GAME_NAMESPACE]: coinTossIcon,
} as const;

export const getGameIconByNamespace = (namespace: string) => {
    return GAME_ICON_MAP[namespace as keyof typeof GAME_ICON_MAP] || sedieIcon;
};

export const calculateBetPanelState = (
    config: IBetPanelConfig,
    betChoice: string,
    odd: number,
    siteId: string,
    gameName: string,
    namespace: string,
    position: IBetPanelPosition
): IBetPanelState => {
    const { minBet, maxBet, maxBetPerChoices, stakeLevel, currency, clientRoundId, clientSeed } = config;
    const { minBet: stakeLevelMinBet = 0, maxBet: stakeLevelMaxBet = 0 } = stakeLevel || {};
    const betChoiceMax = maxBetPerChoices?.[betChoice] || 0;

    const { min: newMin, max: newMax } = calculateMinMaxAmount(
        minBet,
        stakeLevelMinBet,
        maxBet,
        stakeLevel.maxBet,
        betChoiceMax,
        maxBetPerChoices,
        namespace
    );

    const gameIconData = getGameIconByNamespace(namespace);
    const vendorName = siteId === VIVA88_SITE_ID ? SABA_GAMES : VGAMING;

    return {
        top: position.top,
        left: position.left,
        betChoice,
        odd,
        amount: 0,
        currency,
        min: newMin,
        max: newMax,
        payout: '0.00',
        vendorName,
        gameName,
        namespace,
        clientRoundId,
        isSpecialChoice: isSpecialBetChoice(betChoice),
        warnMsg: '',
        clientSeed,
        gameIconData
    };
}; 