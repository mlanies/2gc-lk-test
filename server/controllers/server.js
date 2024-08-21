const Server = require("../models/Server");
const Identity = require("../models/Identity");
const Folder = require("../models/Folder");
const { listFolders } = require("./folder");

module.exports.createServer = async (accountId, configuration) => {
    if (configuration.folderId) {
        const folder = await Folder.findOne({ where: { accountId: accountId, id: configuration.folderId } });
        if (folder === null) {
            return { code: 303, message: "Folder does not exist" };
        }
    }

    if (!configuration.icon) {
        configuration.icon = "server";
    }

    if (configuration.identities) {
        const identities = await Identity.findAll({ where: { accountId, id: configuration.identities } });
        if (identities.length !== configuration.identities.length) {
            return { code: 501, message: "One or more identities do not exist" };
        }
    }

    const server = await Server.create({
        ...configuration,
        accountId,
    });

    return server;
};

module.exports.deleteServer = async (accountId, serverId) => {
    const server = await Server.findOne({ where: { accountId: accountId, id: serverId } });

    if (server === null) {
        return { code: 401, message: "Server does not exist" };
    }

    await Identity.destroy({ where: { id: JSON.parse(server.identities) } });

    await Server.destroy({ where: { id: serverId } });
};

module.exports.editServer = async (accountId, serverId, configuration) => {
    const server = await Server.findOne({ where: { accountId: accountId, id: serverId } });

    if (server === null) {
        return { code: 401, message: "Server does not exist" };
    }

    if (configuration.folderId) {
        const folder = await Folder.findOne({ where: { accountId: accountId, id: configuration.folderId } });
        if (folder === null) {
            return { code: 301, message: "Folder does not exist" };
        }
    }

    if (configuration.identities) {
        const identities = await Identity.findAll({ where: { accountId, id: configuration.identities } });
        if (identities.length !== configuration.identities.length) {
            return { code: 501, message: "One or more identities do not exist" };
        }
    }

    await Server.update(configuration, { where: { id: serverId } });
};

module.exports.getServer = async (accountId, serverId) => {
    const server = await Server.findOne({ where: { accountId: accountId, id: serverId } });

    if (server === null) {
        return { code: 401, message: "Server does not exist" };
    }

    return { ...server, identities: JSON.parse(server.identities) };
};

module.exports.listServers = async (accountId) => {
    const folders = await listFolders(accountId, true);

    const servers = await Server.findAll({ where: { accountId } });

    const folderMap = new Map();
    const flattenFolders = (folders) => {
        folders.forEach(folder => {
            folderMap.set(folder.id, folder);
            if (folder.entries && folder.entries.length > 0) flattenFolders(folder.entries);
        });
    };

    flattenFolders(folders);

    servers.forEach(server => {
        const folder = folderMap.get(server.folderId);
        if (folder) {
            folder.entries.push({ type: "server", id: server.id, icon: server.icon, name: server.name,
                identities: JSON.parse(server.identities), protocol: server.protocol });
        }
    });

    return folders;
};