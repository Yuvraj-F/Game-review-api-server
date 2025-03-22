type GameSearchResponse = {

    gameId: number,

    title: string,

    genreId: number,

    creationDate: string,

    creatorId: number,

    price: number,

    creatorFirstName: string,

    creatorLastName: string,

    rating: number,

    platformIds: number[]
}

type GameQuery = {

    q: string,

    genreIds: number[],

    price: number,

    platformIds: number[],

    creatorId: number,

    reviewerId: number,

    sortBy: string,

    ownedByMe: boolean,

    wishlistedByMe: boolean,

    userId: number
}

type Game = {

    gameId: number,

    title: string,

    genreId: number,

    creatorId: number,

    creatorFirstName: string,

    creatorLastName: string,

    price: number,

    rating: number,

    platformIds: number[],

    creationDate: string,

    description: string,

    numberOfOwners: number,

    numberOfWishlists: number
}