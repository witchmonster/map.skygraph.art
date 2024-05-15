import { FC, Fragment, Dispatch, SetStateAction } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import { getTranslation, getValueByLanguage } from "../common/translation";
import { getConfig } from '../common/visualConfig';
import { SetURLSearchParams } from 'react-router-dom';
import { BuiltAtlasLayout } from '../../exporter/src/common/model';

interface LayoutMenuProps {
    layout: BuiltAtlasLayout;
    setLoading: Dispatch<SetStateAction<boolean>>;
    setGraphShouldUpdate: Dispatch<SetStateAction<boolean>>;
    searchParams: URLSearchParams;
    setSearchParams: SetURLSearchParams;
    moderator: boolean;
    currentLanguage: string;
}

function classNames(...classes) {
    return classes.filter(Boolean).join(' ')
}

function buildMenu(
    layout: BuiltAtlasLayout,
    setLoading: Dispatch<SetStateAction<boolean>>,
    setGraphShouldUpdate: Dispatch<SetStateAction<boolean>>,
    searchParams: URLSearchParams,
    setSearchParams: SetURLSearchParams,
    moderator: boolean,
    currentLanguage: string
) {
    const menuItems: any[] = [];
    getConfig(layout.isSubLayout).getAllLayoutsByMode(moderator).forEach(layout => {
        const chooseLayout = () => {
            searchParams.set('layout', layout.name);
            //when switching layout we don't want to preserve selected node as it might not be available on the new layout
            searchParams.delete('s');
            return "?" + searchParams.toString()
        }
        menuItems.push(
            <Menu.Item
                key={layout.name}>
                {({ active }) => (
                    <a
                        href={`${chooseLayout()}`}
                        className={classNames(
                            active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                            'block px-4 py-2 text-xs'
                        )}
                    >
                        {getValueByLanguage(layout.label, currentLanguage)}
                    </a>

                )}
            </Menu.Item >
        )
    });
    return menuItems;
}

const LayoutMenu: FC<LayoutMenuProps> = ({
    layout,
    setLoading,
    setGraphShouldUpdate,
    searchParams,
    setSearchParams,
    moderator,
    currentLanguage
}) => {
    return (
        <Menu as="div" className="absolute inline-block text-left">
            <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
            >
                <Menu.Items className="absolute bottom-5 right-0 z-10 w-54 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="py-1">
                        {buildMenu(
                            layout,
                            setLoading,
                            setGraphShouldUpdate,
                            searchParams,
                            setSearchParams,
                            moderator,
                            currentLanguage)}
                    </div>
                </Menu.Items>
            </Transition>
            <div>
                <Menu.Button className="inline-flex w-40 ml-1 justify-center gap-x-1.5 rounded-md bg-white px-2 py-1 text-xs font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                    {getTranslation('choose', currentLanguage)}{" "}<span className="hidden md:inline">{getTranslation('layout', currentLanguage)}</span>
                    <span className="md:hidden">{getTranslation('layout', currentLanguage)}</span>
                    <ChevronDownIcon className="-mr-1 -ml-1 h-4 w-4 text-gray-400" aria-hidden="true" />
                </Menu.Button>
            </div>
        </Menu>
    )
}

export default LayoutMenu;