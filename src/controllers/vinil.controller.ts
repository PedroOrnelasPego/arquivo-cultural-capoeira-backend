import { Request, Response } from 'express';
import { getContainer } from '../config/cosmos';
import { v4 as uuidv4 } from 'uuid';

export const getVinis = async (req: Request, res: Response) => {
  try {
    const container = await getContainer();
    // Consulta SQL no Cosmos: Pegamos apenas itens cuja categoria (type) é "vinil"
    // Consulta SQL no Cosmos: Pegamos itens cuja categoria é "vinil", ordenados pelos mais recentes primeiro
    const { resources } = await container.items
      .query('SELECT * FROM c WHERE c.type = "vinil" ORDER BY c.createdAt DESC')
      .fetchAll();

    return res.status(200).json(resources);
  } catch (error: any) {
    console.error('Erro ao buscar vinis:', error);
    return res.status(500).json({ error: 'Erro interno ao buscar o acervo de vinis.', details: error.message });
  }
};

export const getVinisNomes = async (req: Request, res: Response) => {
  try {
    const container = await getContainer();
    const { resources } = await container.items
      .query('SELECT c.id, c.title, c.author FROM c WHERE c.type = "vinil" ORDER BY c.title ASC')
      .fetchAll();

    return res.status(200).json(resources);
  } catch (error: any) {
    console.error('Erro ao buscar nomes dos vinis:', error);
    return res.status(500).json({ error: 'Erro interno ao buscar a lista simplificada dos vinis.' });
  }
};

export const createVinil = async (req: Request, res: Response) => {
  try {
    const { 
      type, title, author, recordLabel, country, year, description, tracksA, tracksB, image, backImage, insertImage, quantity, recordImage, exemplarImages, revised 
    } = req.body;

    if (!title || !author) {
      return res.status(400).json({ error: 'TÍTULO e AUTOR são obrigatórios para engenharia de dados (registro base).' });
    }

    const container = await getContainer();
    
    // Modelagem básica do Vinil baseada no Frontend
    const newVinil = {
      id: uuidv4(),
      type: type || "vinil",
      quantity: quantity !== undefined ? Number(quantity) : 1,
      title,
      author,
      recordLabel: recordLabel || "Independente / Desconhecida",
      country: country || "Brasil",
      year: year || null,
      description: description || null,
      tracksA: tracksA || [],
      tracksB: tracksB || [],
      image: image || null,
      backImage: backImage || null,
      insertImage: insertImage || null,
      recordImage: recordImage || null,
      exemplarImages: exemplarImages || [],
      revised: revised || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const { resource } = await container.items.create(newVinil);
    
    return res.status(201).json(resource);
  } catch (error) {
    console.error('Erro ao criar vinil:', error);
    return res.status(500).json({ error: 'Erro ao cadastrar o item no CosmosDB.' });
  }
};

export const updateVinil = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      type, title, author, recordLabel, country, year, description, tracksA, tracksB, image, backImage, insertImage, quantity, recordImage, exemplarImages, revised 
    } = req.body;

    const container = await getContainer();

    // No Cosmos, precisamos do ID e da Partition Key (type) para referenciar um item corretamente
    // Vamos primeiro tentar pegar o Vinil Original Base para não perder a Data de Criação
    const { resource: currentItem } = await container.item(id, 'vinil').read();

    if (!currentItem) {
      return res.status(404).json({ error: 'Vinil não encontrado para edição.' });
    }

    // Para garantir que a ordem dos campos no JSON do CosmosDB fique organizada (type e quantity no topo),
    // nós construímos o objeto definindo os campos principais primeiro e depois o resto.
    const updatedVinil = {
      id: currentItem.id,
      type: type || currentItem.type,
      quantity: quantity !== undefined ? Number(quantity) : (currentItem.quantity || 1),
      title: title || currentItem.title,
      author: author || currentItem.author,
      recordLabel: recordLabel !== undefined ? recordLabel : currentItem.recordLabel,
      country: country || currentItem.country,
      year: year !== undefined ? year : currentItem.year,
      description: description !== undefined ? description : currentItem.description,
      tracksA: tracksA || currentItem.tracksA,
      tracksB: tracksB || currentItem.tracksB,
      image: image !== undefined ? image : currentItem.image,
      backImage: backImage !== undefined ? backImage : currentItem.backImage,
      insertImage: insertImage !== undefined ? insertImage : currentItem.insertImage,
      recordImage: recordImage !== undefined ? recordImage : currentItem.recordImage,
      exemplarImages: exemplarImages !== undefined ? exemplarImages : currentItem.exemplarImages,
      revised: revised !== undefined ? revised : (currentItem.revised || false),
      createdAt: currentItem.createdAt,
      updatedAt: new Date().toISOString(),
      // Não damos spread em tudo para não bagunçar a ordem, o Cosmos cuidará dos campos de sistema (_rid, _ts, etc)
    };

    // Substitui o item inteiro lá no Banco mantendo o ID
    const { resource } = await container.item(id, currentItem.type).replace(updatedVinil);
    
    return res.status(200).json(resource);
  } catch (error) {
    console.error('Erro ao atualizar vinil:', error);
    return res.status(500).json({ error: 'Erro ao editar o item no CosmosDB.' });
  }
};
