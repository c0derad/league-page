const getGameResultLine = (player) => {
    const game =
        player?.actual?.game;

    if (
        !game ||
        !game.completed
    ) {
        return '';
    }

    return (
        `${game.result} ` +
        `${game.teamScore}-${game.opponentScore} ` +
        `${game.location} ${game.opponent}`
    );
};

const getNextUpLine = (player) => {
    const game =
        player?.actual?.nextGame;

    if (!game) {
        return '';
    }

    return (
        `${game.location} ${game.opponent}`
    );
};
