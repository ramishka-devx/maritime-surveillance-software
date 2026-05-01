I have updated the database like this
as shown in the sql file 2026-04-30-db-redesign.sql

see them now I have to add new data to database too.

when I console log the data I got like this

{
  Message: {
    PositionReport: {
      Cog: 360,
      CommunicationState: 66073,
      Latitude: 51.908303333333336,
      Longitude: 4.500905,
      MessageID: 2,
      NavigationalStatus: 0,
      PositionAccuracy: true,
      Raim: true,
      RateOfTurn: -128,
      RepeatIndicator: 0,
      Sog: 0,
      Spare: 0,
      SpecialManoeuvreIndicator: 0,
      Timestamp: 14,
      TrueHeading: 511,
      UserID: 244710767,
      Valid: true
    }
  },
  MessageType: 'PositionReport',
  MetaData: {
    MMSI: 244710767,
    MMSI_String: 244710767,
    ShipName: 'BOOT6',
    latitude: 51.9083,
    longitude: 4.50091,
    time_utc: '2026-04-30 20:50:14.682686076 +0000 UTC'
  }
}
{
  Message: {
    PositionReport: {
      Cog: 360,
      CommunicationState: 33305,
      Latitude: 52.378971666666665,
      Longitude: 4.896845,
      MessageID: 1,
      NavigationalStatus: 0,
      PositionAccuracy: true,
      Raim: true,
      RateOfTurn: -128,
      RepeatIndicator: 0,
      Sog: 0.2,
      Spare: 0,
      SpecialManoeuvreIndicator: 0,
      Timestamp: 14,
      TrueHeading: 511,
      UserID: 244710832,
      Valid: true
    }
  },
  MessageType: 'PositionReport',
  MetaData: {
    MMSI: 244710832,
    MMSI_String: 244710832,
    ShipName: 'PC HOOFT',
    latitude: 52.37897,
    longitude: 4.89685,
    time_utc: '2026-04-30 20:50:14.683988851 +0000 UTC'
  }
}
{
  Message: {
    PositionReport: {
      Cog: 299.4,
      CommunicationState: 24019,
      Latitude: 54.612155,
      Longitude: 11.378463333333334,
      MessageID: 3,
      NavigationalStatus: 0,
      PositionAccuracy: false,
      Raim: false,
      RateOfTurn: 0,
      RepeatIndicator: 0,
      Sog: 0.1,
      Spare: 0,
      SpecialManoeuvreIndicator: 0,
      Timestamp: 15,
      TrueHeading: 222,
      UserID: 219472000,
      Valid: true
    }
  },
  MessageType: 'PositionReport',
  MetaData: {
    MMSI: 219472000,
    MMSI_String: 219472000,
    ShipName: 'GUARDVESSEL ADVANCER',
    latitude: 54.61216,
    longitude: 11.37846,
    time_utc: '2026-04-30 20:50:14.68058602 +0000 UTC'
  }
}
{
  Message: {
    PositionReport: {
      Cog: 17.4,
      CommunicationState: 85578,
      Latitude: 51.81900333333333,
      Longitude: 4.76375,
      MessageID: 3,
      NavigationalStatus: 5,
      PositionAccuracy: true,
      Raim: false,
      RateOfTurn: 0,
      RepeatIndicator: 0,
      Sog: 0,
      Spare: 0,
      SpecialManoeuvreIndicator: 0,
      Timestamp: 15,
      TrueHeading: 202,
      UserID: 244700457,
      Valid: true
    }
  },
  MessageType: 'PositionReport',
  MetaData: {
    MMSI: 244700457,
    MMSI_String: 244700457,
    ShipName: 'PRINS 3             ',
    latitude: 51.819,
    longitude: 4.76375,
    time_utc: '2026-04-30 20:50:14.686022109 +0000 UTC'
  }
}
{
  Message: {
    PositionReport: {
      Cog: 289.7,
      CommunicationState: 66067,
      Latitude: -33.856213333333336,
      Longitude: 151.24163833333333,
      MessageID: 1,
      NavigationalStatus: 0,
      PositionAccuracy: false,
      Raim: false,
      RateOfTurn: 0,
      RepeatIndicator: 0,
      Sog: 24.2,
      Spare: 0,
      SpecialManoeuvreIndicator: 0,
      Timestamp: 12,
      TrueHeading: 288,
      UserID: 503058420,
      Valid: true
    }
  },
  MessageType: 'PositionReport',
  MetaData: {
    MMSI: 503058420,
    MMSI_String: 503058420,
    ShipName: 'BUNGAREE            ',
    latitude: -33.85621,
    longitude: 151.24164,
    time_utc: '2026-04-30 20:50:14.687399385 +0000 UTC'
  }
}
{
  Message: {
    ShipStaticData: {
      AisVersion: 2,
      CallSign: 'PA4084 ',
      Destination: 'ROTTERDAM    ',
      Dimension: [Object],
      Dte: false,
      Eta: [Object],
      FixType: 15,
      ImoNumber: 0,
      MaximumStaticDraught: 1.2,
      MessageID: 5,
      Name: 'NAUTILUS',
      RepeatIndicator: 0,
      Spare: false,
      Type: 37,
      UserID: 244126626,
      Valid: true
    }
  },
  MessageType: 'ShipStaticData',
  MetaData: {
    MMSI: 244126626,
    MMSI_String: 244126626,
    ShipName: 'NAUTILUS',
    latitude: 51.92058,
    longitude: 4.50629,
    time_utc: '2026-04-30 20:50:14.689615927 +0000 UTC'
  }
}

I want to add them to the database.

first check if the ship is avaible in the ship table.
if not add it to the ship table.
then create record in the ais_positions table.

use Kafka for quiening