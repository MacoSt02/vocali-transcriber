import { downloadTextFile } from './download';

describe('downloadTextFile', () => {
  it('crea un enlace de descarga con el nombre de fichero y el contenido dados', () => {
    const createObjectURL = jest.fn().mockReturnValue('blob:mock-url');
    const revokeObjectURL = jest.fn();
    global.URL.createObjectURL = createObjectURL;
    global.URL.revokeObjectURL = revokeObjectURL;

    const clickSpy = jest.fn();
    const anchor = document.createElement('a');
    anchor.click = clickSpy;
    const createElementSpy = jest.spyOn(document, 'createElement').mockReturnValue(anchor);

    downloadTextFile('transcripcion-1.txt', 'hola mundo');

    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(anchor.download).toBe('transcripcion-1.txt');
    expect(anchor.href).toContain('blob:mock-url');
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');

    createElementSpy.mockRestore();
  });
});
